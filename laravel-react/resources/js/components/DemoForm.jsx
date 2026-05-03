import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

function toCleanValues(formData) {
    const values = {};

    for (const [key, value] of formData.entries()) {
        values[key] = typeof value === 'string' ? value.trim() : value;
    }

    return values;
}

function shouldShowField(field, formValues) {
    if (!field.showWhen) {
        return true;
    }

    const controllingValue = formValues[field.showWhen.field] || '';

    if (Array.isArray(field.showWhen.values)) {
        return field.showWhen.values.includes(controllingValue);
    }

    return controllingValue === field.showWhen.value;
}

export default function DemoForm({
    title,
    description,
    fields,
    submitLabel,
    successMessage,
    tableName,
    prepareSubmission,
    onSubmit,
    submittingLabel,
    idleMessage,
    variant,
}) {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successNotice, setSuccessNotice] = useState(successMessage);
    const [formValues, setFormValues] = useState({});

    function handleFieldChange(event) {
        const { name, value } = event.target;

        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: typeof value === 'string' ? value.trim() : value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage('');
        setSubmitted(false);
        setIsRedirecting(false);
        setIsSubmitting(true);

        const form = event.currentTarget;
        const values = toCleanValues(new FormData(form));

        try {
            let result = null;

            if (onSubmit) {
                result = await onSubmit(values, form);
            } else if (tableName) {
                if (!isSupabaseConfigured || !supabase) {
                    throw new Error('Hindi pa naka-set ang Supabase keys sa local environment ng website.');
                }

                const payload = prepareSubmission ? prepareSubmission(values) : values;
                const { error } = await supabase.from(tableName).insert(payload);

                if (error) {
                    throw error;
                }
            }

            const nextSuccessMessage = result?.successMessage || successMessage;
            const shouldResetForm = result?.resetForm ?? true;

            if (shouldResetForm) {
                form.reset();
                setFormValues({});
            }

            setSuccessNotice(nextSuccessMessage);
            setSubmitted(true);

            if (result?.redirectTo) {
                setIsRedirecting(true);
                window.setTimeout(() => {
                    window.location.assign(result.redirectTo);
                }, result.redirectDelayMs ?? 1400);
            }
        } catch (error) {
            setSubmitted(false);
            setErrorMessage(error?.message || 'May problema sa pag-save ng form. Pakisubukang muli.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const sectionClassName = variant ? `form-card form-card--${variant}` : 'form-card';
    const noticeClassName = [
        'form-card__notice',
        errorMessage ? 'form-card__notice--error' : '',
        submitted && !errorMessage ? 'form-card__notice--success' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <section className={sectionClassName}>
            <div className="form-card__header">
                <h3 className="form-card__title">{title}</h3>
                <p className="form-card__text">{description}</p>
            </div>

            <form className="form-shell" onSubmit={handleSubmit} aria-busy={isSubmitting || isRedirecting}>
                <div className="form-grid">
                    {fields.map((field) => {
                        if (!shouldShowField(field, formValues)) {
                            return null;
                        }

                        const className = field.full ? 'form-field form-field--full' : 'form-field';

                        if (field.type === 'select') {
                            return (
                                <div className={className} key={field.name}>
                                    <label htmlFor={field.name}>{field.label}</label>
                                    <select
                                        id={field.name}
                                        name={field.name}
                                        defaultValue=""
                                        required={field.required}
                                        disabled={isSubmitting || isRedirecting}
                                        autoComplete={field.autoComplete}
                                        onChange={handleFieldChange}
                                    >
                                        <option value="" disabled>
                                            {field.placeholder || `Piliin ang ${field.label}`}
                                        </option>
                                        {field.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        }

                        if (field.type === 'textarea') {
                            return (
                                <div className={className} key={field.name}>
                                    <label htmlFor={field.name}>{field.label}</label>
                                    <textarea
                                        id={field.name}
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        required={field.required}
                                        disabled={isSubmitting || isRedirecting}
                                        autoComplete={field.autoComplete}
                                        onChange={handleFieldChange}
                                    />
                                </div>
                            );
                        }

                        return (
                            <div className={className} key={field.name}>
                                <label htmlFor={field.name}>{field.label}</label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type || 'text'}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    disabled={isSubmitting || isRedirecting}
                                    autoComplete={field.autoComplete}
                                    onChange={handleFieldChange}
                                />
                            </div>
                        );
                    })}
                </div>

                <button
                    className={`button-link form-submit ${isSubmitting || isRedirecting ? 'form-submit--loading' : ''}`}
                    type="submit"
                    disabled={isSubmitting || isRedirecting}
                >
                    {isRedirecting ? 'Redirecting...' : isSubmitting ? submittingLabel || 'Nagse-save...' : submitLabel}
                </button>
            </form>

            <div className={noticeClassName}>
                {errorMessage || (submitted ? successNotice : idleMessage || 'Sagutan ang form sa ibaba para magpatuloy.')}
            </div>
        </section>
    );
}
